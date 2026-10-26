/* down · undoes 0015 without destroying anything: the table stays (dropping it would lose her
   wishes); the app of 0014 simply does not read it. */

begin;

update migracion set version = -15, aplicada_en = now() where version = 15;   -- «15, undone»: the record stays

commit;
