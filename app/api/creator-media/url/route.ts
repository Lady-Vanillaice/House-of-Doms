import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "../../../../lib/supabase/server";

function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return null;
 return createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get("id");
 if(!id)return NextResponse.json({error:"Medien-ID fehlt."},{status:400});
 const s=await createServerClient();
 const{data:auth}=await s.auth.getUser();
 if(!auth.user)return NextResponse.json({error:"Nicht angemeldet."},{status:401});
 const{data,error}=await s.rpc("get_creator_media_private_ref",{p_media_id:id});
 if(error)return NextResponse.json({error:error.message},{status:400});
 const row=Array.isArray(data)?data[0]:data;
 if(!row?.storage_bucket||!row?.storage_path)return NextResponse.json({error:"Kein Zugriff."},{status:403});
 const client=admin();
 if(!client)return NextResponse.json({error:"Privater Medienspeicher ist serverseitig noch nicht konfiguriert."},{status:503});
 const{data:signed,error:signError}=await client.storage.from(row.storage_bucket).createSignedUrl(row.storage_path,900);
 if(signError||!signed?.signedUrl)return NextResponse.json({error:signError?.message||"Signierte URL konnte nicht erstellt werden."},{status:500});
 return NextResponse.json({url:signed.signedUrl,expiresIn:900});
}
