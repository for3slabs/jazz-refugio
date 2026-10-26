/* down · undoes 0013 without destroying anything: the column stays (dropping it would make her
   cat plant every flower again); the app of 0012 simply does not read it. */

begin;

update migracion set version = -13, aplicada_en = now() where version = 13;   -- «13, undone»: the record stays

commit;
