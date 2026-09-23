export const brandKey=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
export const brandCatalog:Record<string,{name:string;logo:string;domain:string}>={
 cerave:{name:'CeraVe',logo:'/brands/cerave.svg',domain:'cerave.com'},
 airtel:{name:'Airtel',logo:'/brands/airtel.svg',domain:'airtel.in'},
 blackwhite:{name:'Black & White',logo:'/brands/black-white.png',domain:''},
 blackandwhite:{name:'Black & White',logo:'/brands/black-white.png',domain:''}
};
export const knownBrand=(name:string)=>brandCatalog[brandKey(name)];
