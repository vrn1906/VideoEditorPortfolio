'use client';
import {useState} from 'react';
import {knownBrand,brandKey} from './brand-catalog.js';
export default function BrandLogo({name,logo,compact=false}:{name:string;logo?:string;compact?:boolean}){const src=logo||knownBrand(name)?.logo;const [failed,setFailed]=useState('');return <span className={'brand-logo '+(compact?'compact':'')} title={name} data-brand={brandKey(name)}>{src&&failed!==src?<img src={src} alt={name+' logo'} loading="lazy" onError={()=>setFailed(src)}/>:<span>{name}</span>}</span>}
