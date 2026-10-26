/* down · undoes 0014 without destroying anything: the columns stay (dropping them would lose her
   dates and links); the app of 0013 simply does not read them. */

begin;

update migracion set version = -14, aplicada_en = now() where version = 14;   -- «14, undone»: the record stays

commit;
