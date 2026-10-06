# Core flow QA

This checklist covers the GitHub-only production path. It intentionally excludes Stripe secrets, Vercel environment setup, email providers, DNS and external webhook registration.

## Creator path
1. Register with “Content & Sessions anbieten” or “Beides”.
2. Confirm creator registration routes to `/creator/onboarding`.
3. Complete onboarding and create a draft public creator page.
4. Open `/homepage-builder`, publish the creator page and verify the `house-of-doms.com/d/<slug>` URL.
5. Upload one public file, one PPV file and one membership file.
6. Confirm public media uses the public bucket; PPV/membership media uses `creator-private-media`.
7. Confirm restricted media is never returned as a public URL and is rendered only through a short-lived signed URL after authorization.
8. Create availability in `/kalender` and manage session requests in `/sessions`.
9. Create a membership plan and verify switch creators have the same creator controls.
10. Open `/hub` and verify creator metrics and links.

## Member path
1. Register as a member and log in.
2. Discover a published creator.
3. Open the creator page and request a session.
4. Confirm the session appears in `/sessions` and `/hub`.
5. Request PPV content and verify it remains locked while payment is pending.
6. Activate the purchase manually as the creator and verify the buyer receives a signed private-media URL.
7. Join a House, request a membership, activate it manually and verify membership-only content becomes accessible.
8. Send a chamber message and verify the recipient sees it in `/kammer` and `/benachrichtigungen`.

## Moderation
1. Use `/melden` or a “Melden” link on a creator/content surface.
2. Confirm the report is inserted for the signed-in reporter.
3. As a platform admin, open `/plattform-admin`.
4. Move the report through `reviewing`, `resolved` or `dismissed`.

## Regression rules
- No production flow may depend on the retired `/growth` demo state.
- No message query may use `receiver_id`; the canonical field is `recipient_id`.
- Switch accounts must be accepted anywhere creator permissions are checked.
- Paid or membership content must not be published from the public media bucket.
- Legacy restricted rows without a private storage path are deliberately unpublished by migration 041 and must be re-uploaded.