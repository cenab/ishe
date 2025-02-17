batu@Mac-mini demantia-real-talk % npx supabase start         
WARN: no seed files matched pattern: supabase/seed.sql
v2.34.7: Pulling from supabase/realtime
6d29a096dd42: Pull complete 
d5c07cf7fdc8: Pull complete 
2ee980df63c7: Pull complete 
4bea0d5b5322: Pull complete 
4d6c328bc4bd: Pull complete 
4ee2a69a1495: Pull complete 
faae6eed9e3e: Pull complete 
14a9a4997af6: Pull complete 
Digest: sha256:47326b3c8e471e789ce9517ef10fe2787ae1d209cddb5dd013b3ab907ae6fd6c
Status: Downloaded newer image for public.ecr.aws/supabase/realtime:v2.34.7
v1.14.5: Pulling from supabase/storage-api
9986a736f7d3: Already exists 
11bd006db9ca: Pull complete 
1abae2601f82: Pull complete 
50c614424faf: Pull complete 
57861b2692c0: Pull complete 
0ab23c1dd7ce: Pull complete 
dabdc7f74ee8: Pull complete 
979ab47c9d44: Pull complete 
b2b1f70321b4: Pull complete 
eb92ad80116d: Pull complete 
Digest: sha256:ee0826bde4966c4cb70b79605ea5197d708dfa6ceeee7f427c4cad8b539ffda3
Status: Downloaded newer image for public.ecr.aws/supabase/storage-api:v1.14.5
v2.167.0: Pulling from supabase/gotrue
9986a736f7d3: Already exists 
44422bc5fc1b: Pull complete 
2c9cc82a3b46: Pull complete 
6958f2cddd2f: Pull complete 
e9696bb412a9: Pull complete 
9d70ef758bd6: Pull complete 
Digest: sha256:d56b93b3d25d0a533b29e8d52ccca335e13188f25c9dda89401ea00a0a1dfb8a
Status: Downloaded newer image for public.ecr.aws/supabase/gotrue:v2.167.0
Seeding globals from roles.sql...
1.4.0: Pulling from supabase/logflare
261da4162673: Pull complete 
7d2a960092ca: Pull complete 
cab6fd4eb5d1: Pull complete 
05267fd6f742: Pull complete 
1e3eeb829493: Pull complete 
4cc5b43cfbf9: Pull complete 
455249722616: Pull complete 
4f4fb700ef54: Pull complete 
105209f6e8d8: Pull complete 
Digest: sha256:e693c787ffe1ae17b6e4e920a3cdd212416d3e1f97e1bd7cb5b67de0abbb0264
Status: Downloaded newer image for public.ecr.aws/supabase/logflare:1.4.0
WARNING: analytics requires mounting default docker socket: /var/run/docker.sock
0.28.1-alpine: Pulling from supabase/vector
6f0e733d82e2: Pull complete 
6bb05e259e43: Pull complete 
5b4d8c7e225f: Pull complete 
885405f2b3ce: Pull complete 
441655651244: Pull complete 
4f4fb700ef54: Pull complete 
Digest: sha256:4bc04aca94a44f04b427a490f346e7397ef7ce61fe589d718f744f7d92cb5c80
Status: Downloaded newer image for public.ecr.aws/supabase/vector:0.28.1-alpine
v1.67.0: Pulling from supabase/edge-runtime
4d2547c08499: Pull complete 
d28a2ca8f8fd: Pull complete 
d824eea57571: Pull complete 
d5f81ab877c9: Pull complete 
73a7cf01361f: Pull complete 
05e9c330cfed: Pull complete 
Digest: sha256:520372766aa2b4094ea4a458ca042a415b713e671de5918d92954fc676f3af3e
Status: Downloaded newer image for public.ecr.aws/supabase/edge-runtime:v1.67.0
v0.84.2: Pulling from supabase/postgres-meta
83d624c4be2d: Pull complete 
d0ddb100d04a: Pull complete 
652558b6f357: Pull complete 
4fa70539adf7: Pull complete 
da4e90507537: Pull complete 
8fe3966837b1: Pull complete 
9334b1882abb: Pull complete 
b3f4b4f9258e: Pull complete 
09fd6e1cff6f: Pull complete 
bf5e5af60efc: Pull complete 
Digest: sha256:d0a96973e9f1b6303f7500421a459af3d7273b3f9f1db38610899f9f573da7c7
Status: Downloaded newer image for public.ecr.aws/supabase/postgres-meta:v0.84.2
20250113-83c9420: Pulling from supabase/studio
f5c6876bb3d7: Pull complete 
81a01029a719: Pull complete 
06191ad9adfe: Pull complete 
6b9df25993e6: Pull complete 
2a08b3fc7ad7: Pull complete 
3ede6f987bdb: Pull complete 
dba149ec89b8: Pull complete 
ce10b9e1a6e3: Pull complete 
03ec6024a471: Pull complete 
ec9b130d5203: Pull complete 
4e241805ddbb: Pull complete 
Digest: sha256:29cade83d6f2edd1ed69702d8a6a9f1b8aae608a24901d2c650edeba75ed6f87
Status: Downloaded newer image for public.ecr.aws/supabase/studio:20250113-83c9420
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local