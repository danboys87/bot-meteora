"use strict";
// Percent settings are percentage points; EMERGENCY_DROP remains a fraction.
function updatePeak(pos,val,now=Date.now()){
 if(!val.quoted)return;
 if(pos.capitalAsset==='SOL'?(!Number.isFinite(pos.peakPnlCapital)||val.pnlCapital>pos.peakPnlCapital):(!Number.isFinite(pos.peakPnlUsd)||val.pnlUsd>pos.peakPnlUsd)){pos.peakPnlCapital=val.pnlCapital;pos.peakPnlUsd=val.pnlUsd;pos.peakPnlPctUsdc=val.pnlPct;pos.peakPnlAt=new Date(now).toISOString();}
 pos.lastExitUsdc=val.usdcOut;pos.lastPnlUsd=val.pnlUsd;pos.lastPnlPctUsdc=val.pnlPct;
}
// Emergency TP: trigger is RELATIVE to the lower range the position was opened with. Arms when the active price has
// fallen from the leg's entry price by >= openRangeDownPct * EMERGENCY_TP_TRIGGER_RANGE_PCT/100 (range -50% & 50 -> -25%;
// range -70% -> -35%). Once armed the position is flagged deepDrawdown persistently; when enabled its TP target becomes
// EMERGENCY_TP_PCT (same net capital-asset PnL basis as normal TP). Price drop derived from bins:
// price/entry = (1+binStep/1e4)^(activeBin-entryActiveBin). Tracked even while the rule is disabled.
function priceDropPct(pos,activeBin){
 const step=Number(pos.binStep),e=Number(pos.entryActiveBin);
 if(!Number.isFinite(step)||step<=0||!Number.isFinite(e)||!Number.isFinite(activeBin))return null;
 return (1-Math.pow(1+step/1e4,activeBin-e))*100;
}
// Range used at open: strategy snapshot RANGE_DOWN_PCT (frozen at entry); fallback = geometry of entry bin vs lower edge. Stored once.
function openRangeDownPct(pos){
 if(Number.isFinite(pos.openRangeDownPct))return pos.openRangeDownPct;
 let r=Number(pos.strategySettings?.RANGE_DOWN_PCT);
 if(!(r>0)){const step=Number(pos.binStep),n=Number(pos.entryActiveBin)-Number(pos.minBinId);if(step>0&&n>0)r=(1-Math.pow(1+step/1e4,-n))*100;}
 if(r>0)pos.openRangeDownPct=r;
 return r>0?r:null;
}
function triggerDropPct(pos,settings){const r=openRangeDownPct(pos),f=Number(settings.EMERGENCY_TP_TRIGGER_RANGE_PCT??50);return r&&Number.isFinite(f)?r*f/100:null;}
function updatePriceDrop(pos,activeBin,settings={},now=Date.now()){
 const d=priceDropPct(pos,activeBin);if(d==null)return;
 if(!Number.isFinite(pos.maxPriceDropPct)||d>pos.maxPriceDropPct){pos.maxPriceDropPct=d;pos.maxPriceDropAt=new Date(now).toISOString();pos.maxPriceDropBin=activeBin;}
 const trig=triggerDropPct(pos,settings);
 if(!pos.deepDrawdown&&trig!=null&&pos.maxPriceDropPct>=trig){pos.deepDrawdown=true;pos.deepDrawdownAt=new Date(now).toISOString();pos.deepDrawdownBin=activeBin;pos.deepDrawdownDropPct=pos.maxPriceDropPct;pos.deepDrawdownTriggerPct=trig;}
}
function effectiveTp(pos,settings){
 const tp=Number(settings.TP_USD_PCT??(settings.TP!=null?Number(settings.TP)*100:20));
 const trig=triggerDropPct(pos,settings),deep=!!pos.deepDrawdown||(trig!=null&&Number.isFinite(pos.maxPriceDropPct)&&pos.maxPriceDropPct>=trig);
 if(settings.EMERGENCY_TP_ENABLED===true&&deep)return {pct:Number(settings.EMERGENCY_TP_PCT??10),emergency:true};
 return {pct:tp,emergency:false};
}
// Stale close. ANY keeps the original behaviour (close as soon as age >= MAX_HOURS, any PnL).
function staleCheck(pos,val,settings,now=Date.now()){
 const maxH=Number(settings.MAX_HOURS),ageH=(now-Date.parse(pos.openedAt))/3600000;
 if(settings.STALE_CLOSE_ENABLED===false||!Number.isFinite(maxH)||!(ageH>=maxH))return {close:false,aged:ageH>=maxH,ageH};
 const mode=String(settings.STALE_EXIT_MODE||'ANY').toUpperCase(),x=Number(settings.STALE_EXIT_PCT??0),pnl=Number(val?.pnlPct),base='max age '+maxH+'h';
 if(mode==='ANY')return {close:true,aged:true,ageH,reason:base};
 if(!Number.isFinite(pnl))return {close:false,aged:true,ageH};
 const need=mode==='MINUS'?-Math.abs(x):mode==='BEP'?0:mode==='PROFIT'?Math.abs(x):null;
 if(need===null)return {close:true,aged:true,ageH,reason:base};
 const tag=mode==='BEP'?'BEP':(need>=0?'+':'')+need+'%';
 return pnl>=need?{close:true,aged:true,ageH,reason:base+' (stale '+mode+' '+tag+')'}:{close:false,aged:true,ageH,waiting:'PnL '+pnl.toFixed(2)+'% < '+tag};
}
function decide({pos,val,activeBin,settings,now=Date.now(),pollId=null,stopReason=null}){
 updatePeak(pos,val,now);updatePriceDrop(pos,activeBin,settings,now);
 const right=activeBin>pos.maxBinId,left=activeBin<pos.minBinId;
 const etp=effectiveTp(pos,settings),tpPct=etp.pct,tpReady=Number.isFinite(val.pnlPct)&&Number.isFinite(tpPct)&&val.pnlPct>=tpPct;
 const maxFailures=Number(settings.QUOTE_FAILURE_POLLS??10);
 if(left){if(!pos.oorLeftSince)pos.oorLeftSince=new Date(now).toISOString();}else pos.oorLeftSince=null;
 const advance=pollId===null||pos.lastExitDecisionPollId!==pollId;
 if(advance){
  pos.oorRightPolls=right?(pos.oorRightPolls||0)+1:0;
  pos.quoteUnavailablePolls=(right||tpReady)&&!val.quoted?(pos.quoteUnavailablePolls||0)+1:0;
  if(pollId!==null)pos.lastExitDecisionPollId=pollId;
 }else if(val.quoted)pos.quoteUnavailablePolls=0;
 if(stopReason)return stopReason;
 // PAPER emergency is net position equity vs original entry USDC, including fees/costs/carry.
 if(Number.isFinite(val.pnlPct)&&val.pnlPct<=-100*(settings.EMERGENCY_DROP??.20))return 'emergency_stop';
 {const st=staleCheck(pos,val,settings,now);if(st.close)return st.reason;}
 if(settings.OOR_RIGHT_CLOSE!==false&&right&&pos.oorRightPolls>=(settings.OOR_RIGHT_CONFIRM_POLLS??2)){
  if(!Number.isFinite(val.pnlPct))return null;
  if(!val.quoted&&(pos.quoteUnavailablePolls||0)<maxFailures)return null;
  if((pos.rightRepositions||0)>=(settings.OOR_RIGHT_MAX_REPOSITIONS??2))return 'oor_right_reposition_limit';
  if(val.pnlPct>=(settings.OOR_RIGHT_MIN_PROFIT_PCT??.5))return val.quoted?'oor_right_take_profit':'oor_right_take_profit_fallback';
  return 'oor_right_reposition'; // failed reopen is transactional and retried, never a forced close
 }
 if(tpReady&&etp.emergency&&(val.quoted||(pos.quoteUnavailablePolls||0)>=maxFailures))return 'emergency_tp '+(pos.capitalAsset||'USDC')+' +'+tpPct+'%'+(val.quoted?'':' (on-chain fallback)');
 if(tpReady&&(val.quoted||(pos.quoteUnavailablePolls||0)>=maxFailures))return 'TP '+(pos.capitalAsset||'USDC')+' +'+tpPct+'%'+(val.quoted?'':' (on-chain fallback)');
 if(val.quoted&&settings.TRAIL_ENABLED&&pos.peakPnlPctUsdc>=settings.TRAIL_ARM_PCT&&pos.peakPnlPctUsdc-val.pnlPct>=settings.TRAIL_DROP_PCT)return 'trailing_tp_usdc';
 if(left&&settings.OOR_MAX_MIN>0&&val.quoted&&(pos.capitalAsset==='SOL'?val.pnlCapital:val.pnlUsd)<0&&(now-Date.parse(pos.oorLeftSince))/60000>=settings.OOR_MAX_MIN)return 'oor_left_timeout';
 return null;
}
module.exports={staleCheck,updatePeak,priceDropPct,openRangeDownPct,triggerDropPct,updatePriceDrop,effectiveTp,decide};
