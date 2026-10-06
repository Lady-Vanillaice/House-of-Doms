import fs from "node:fs";

const read=(p)=>fs.readFileSync(p,"utf8");
const checks=[
 ["notifications use recipient_id",!read("app/benachrichtigungen/page.tsx").includes("receiver_id")],
 ["switch memberships enabled",read("app/abonnements/page.tsx").includes('"switch"')],
 ["legacy growth demo retired",read("app/growth/page.tsx").includes('redirect("/hub")')],
 ["restricted uploads use private bucket",read("app/store/creator-media-publisher.tsx").includes("creator-private-media")],
 ["secure media RPC used in store",read("app/store/page.tsx").includes("get_public_creator_media_feed_v2")],
 ["secure media RPC used on creator pages",read("app/d/[slug]/page.tsx").includes("get_creator_media_for_site_v2")],
 ["public creator domain corrected",!read("app/homepage-builder/page.tsx").includes("houseofdoms.de")],
 ["production hardening migration present",read("supabase/migrations/041_production_hardening.sql").includes("creator-private-media")],
 ["direct messages repaired",read("supabase/migrations/041_production_hardening.sql").includes("alter column house_id drop not null")],
 ["moderation connected",read("app/plattform-admin/page.tsx").includes("get_platform_reports")],
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks) console.log((ok?"✓ ":"✗ ")+name);
if(failed.length){console.error("Core-flow checks failed: "+failed.map(([n])=>n).join(", "));process.exit(1)}
