/* down · undoes 0006 without destroying anything: the two columns stay (dropping them would lose
   what was marked); the app of 0005 does not read them. */

begin;

update migracion set version = -6, aplicada_en = now() where version = 6;   -- «6, undone»: the record stays

commit;
