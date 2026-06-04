const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function makeReferralCode(name='',existing=[]){
  const prefix=String(name||'YL').replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase() || 'YL'
  let code=''
  for(let tries=0; tries<50; tries++){
    code=prefix + '-' + Array.from({length:5},()=>ALPHABET[Math.floor(Math.random()*ALPHABET.length)]).join('')
    if(!existing.includes(code)) return code
  }
  return prefix + '-' + Date.now().toString(36).toUpperCase().slice(-6)
}
export function findReferralOwner(customers=[],code=''){
  const clean=String(code||'').trim().toUpperCase()
  return (customers||[]).find(c=>String(c.referralCode||'').toUpperCase()===clean) || null
}
export function referralReward(settings={}){
  return settings.referralReward || {type:'Bill credit', value:50, note:'Default $50 credit after referred customer signs.'}
}
