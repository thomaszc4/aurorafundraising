alter table "public"."participant_messages" add column "audience_filters" jsonb default '{}'::jsonb;
