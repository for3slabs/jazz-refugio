/* down · undoes 0004 without destroying anything: the column stays (dropping it would lose her
   best day); the app of 0003 simply does not read it. */

begin;

update migracion set version = -4, aplicada_en = now() where version = 4;   -- «4, undone»: the record stays

commit;
