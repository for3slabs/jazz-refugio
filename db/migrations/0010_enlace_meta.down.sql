/* down · undoes 0010 without destroying anything: the four columns stay (dropping them would lose
   the links she pinned); the app of 0009 does not read them. */

begin;

update migracion set version = -10, aplicada_en = now() where version = 10;   -- «10, undone»: the record stays

commit;
