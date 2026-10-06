import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "../../../../lib/supabase/server";

const MAX_BYTES=100*1024*1024;
const allowed=new Set(["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/quicktime","video/webm","audio/mpeg","audio/mp4","audio/webm","audio/ogg"]);

function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return null;
 return createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function POST(req:NextRequest){
 const s=await createServerClient();
 const{data:auth}=await s.auth.getUser();
 if(!auth.user)return NextResponse.json({error:"Nicht angemeldet."},{status:401});
 const{data:isCreator,error:roleError}=await s.rpc("is_creator_user",{p_user:auth.user.id});
 if(roleError||!isCreator)return NextResponse.json({error:"Nur Creator können Medien hochladen."},{status:403});
 const form=await req.formData();
 const file=form.get("file");
 const access=String(form.get("access")||"public");
 if(!(file instanceof File))return NextResponse.json({error:"Datei fehlt."},{status:400});
 if(!["public","ppv","members"].includes(access))return NextResponse.json({error:"Ungültige Freigabe."},{status:400});
 if(file.size<=0||file.size>MAX_BYTES)return NextResponse.json({error:"Datei ist leer oder größer als 100 MB."},{status:400});
 if(file.type&&!allowed.has(file.type))return NextResponse.json({error:"Dieser Dateityp wird nicht unterstützt."},{status:400});
 const client=admin();
 if(!client)return NextResponse.json({error:"Privater Medienspeicher ist serverseitig noch nicht konfiguriert."},{status:503});
 const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
 const path=`${auth.user.id}/content/${crypto.randomUUID()}-${safe}`;
 const bucket=access==="public"?"domina-site-media":"creator-private-media";
 const bytes=await file.arrayBuffer();
 const{error}=await client.storage.from(bucket).upload(path,bytes,{contentType:file.type||"application/octet-stream",upsert:false});
 if(error)return NextResponse.json({error:error.message},{status:500});
 const publicUrl=access==="public"?client.storage.from(bucket).getPublicUrl(path).data.publicUrl:null;
 return NextResponse.json({bucket,path,publicUrl});
}
