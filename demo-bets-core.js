export const stakes=[100,500,1000];
export function offerTerms(side,stake,advantage=false){if(!['white','blue'].includes(side)||!stakes.includes(stake))throw Error('Selecciona un lado y uno de los montos disponibles.');return {side,stake,opponentStake:advantage?stake/2:stake}}
export function opposite(side){return side==='white'?'blue':'white'}
export function canAccept(offer,uid,now=Date.now()){return !!uid&&offer.mode==='demo'&&offer.status==='open'&&offer.makerUid!==uid&&offer.expiresAt?.toMillis()>now}
export function compatible(a,b,now=Date.now()){return !!a.makerName&&!!b.makerName&&a.mode==='demo'&&b.mode==='demo'&&a.status==='open'&&b.status==='open'&&a.makerUid!==b.makerUid&&a.side!==b.side&&a.stake===b.opponentStake&&a.opponentStake===b.stake&&a.expiresAt?.toMillis()>now&&b.expiresAt?.toMillis()>now}
export function roomFromSearch(search){const params=new URLSearchParams(search),province=params.get('provincia')||'',venue=params.get('gallera')||'';return /^[a-z0-9-]{1,70}$/.test(province)&&/^[12]$/.test(venue)?province+'-'+venue:'demo-general'}
