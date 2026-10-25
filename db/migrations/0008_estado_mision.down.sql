/* down · undoes 0008 without destroying anything: the two columns stay (dropping them would lose
   how long her missions took); the app of 0007 does not read them. */

begin;

update migracion set version = -8, aplicada_en = now() where version = 8;   -- «8, undone»: the record stays

commit;
