/* down · undoes 0018: her changed word is dropped and the word in Vercel (REFUGIO_CLAVE) opens her
   place again. */

begin;

drop table palabra;
update migracion set version = -18, aplicada_en = now() where version = 18;   -- «18, undone»: the record stays

commit;
