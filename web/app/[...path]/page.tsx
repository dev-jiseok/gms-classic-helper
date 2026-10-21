import {notFound} from 'next/navigation';
import CompassApp from '../compass-app';
import {routeForPath} from '@/lib/site-routes.mjs';
export default async function FeaturePage({params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;if(!routeForPath('/'+path.join('/')))notFound();
 return <CompassApp/>;
}
