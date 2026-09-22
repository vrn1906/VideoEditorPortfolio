export type Video = { tag?:string; id: string; url: string; platform: 'youtube'|'instagram'; category: 'Long-form'|'Shorts'|'Reels'; title: string; thumbnail: string; clientName: string; clientUrl: string; clientImage: string; featured: boolean; brandIntegrated?:boolean; brandName?:string; brandLogo?:string; views?:number|null; viewsUpdatedAt?:number|null; viewsAttemptedAt?:number };
import migration from './migration.json';
import snapshots from './verified-views.json';
export const initialVideos:Video[]=migration.videos.map(video=>{
 const count=(snapshots as Record<string,{views:number;updatedAt:number}>)[video.platform+':'+video.id];
 return {...video,views:count?.views??null,viewsUpdatedAt:count?.updatedAt??null} as Video;
});
export const initialSettings={...migration.settings,brandLogos:migration.settings.brandLogos as Record<string,string>};
