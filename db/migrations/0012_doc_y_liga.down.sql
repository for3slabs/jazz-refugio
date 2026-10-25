/* down · undoes 0012 without destroying anything: the docs and links she added stay (their rows,
   their files in Blob, the columns), and an enum value cannot be removed anyway. The app of 0011
   does not know these kinds; the record says 12 was undone. */

begin;

update migracion set version = -12, aplicada_en = now() where version = 12;   -- «12, undone»: the record stays

commit;
