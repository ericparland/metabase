(ns metabase.db.spec
  "Functions for creating JDBC DB specs for a given engine.
   Only databases that are supported as application DBs should have functions in this namespace;
   otherwise, similar functions are only needed by drivers, and belong in those namespaces.")

(defn h2
  "Create a database specification for a h2 database. Opts should include a key
  for :db which is the path to the database file."
  [{:keys [db]
    :or {db "h2.db"}
    :as opts}]
  (merge {:classname "org.h2.Driver" ; must be in classpath
          :subprotocol "h2"
          :subname db}
         (dissoc opts :db)))

(defn postgres
  "Create a database specification for a postgres database. Opts should include
  keys for :db, :user, and :password. You can also optionally set host and
  port."
  [{:keys [host port db]
    :or {host "localhost", port 5432, db ""}
    :as opts}]
  (merge {:classname "org.postgresql.Driver" ; must be in classpath
          :subprotocol "postgresql"
          :subname (str "//" host ":" port "/" db)}
         (dissoc opts :host :port :db)))

(defn mysql
  "Create a database specification for a mysql database. Opts should include keys
  for :db, :user, and :password. You can also optionally set host and port.
  Delimiters are automatically set to \"`\"."
  [{:keys [host port db]
    :or {host "localhost", port 3306, db ""}
    :as opts}]
  (merge {:classname "com.mysql.jdbc.Driver" ; must be in classpath
          :subprotocol "mysql"
          :subname (str "//" host ":" port "/" db)
          :delimiters "`"}
         (dissoc opts :host :port :db)))

(defn impala
           "Create a database specification for a Impala database. Opts should include keys
           for :db, :user, and :password and authentication mechanism."
           [{:keys [host port db make-pool? authMech user password connProperties]
             :or {host "localhost", port 21050, db "default", make-pool? true, authMech "0" connProperties ""}
             :as opts}]
           (merge {:classname "com.cloudera.impala.jdbc41.Driver" ; must be in plugins directory
                   :subprotocol "impala"
                   :subname (str "//" host ":" port "/" db ";AuthMech=" authMech ";UID=" user ";PWD=" password  connProperties ";UseNativeQuery=1")  ;;Use UseNativeQuery=1 to prevent SQL rewriting by the JDBC driver
                   :make-pool? make-pool?}
                  (dissoc opts :host :port :db :connProperties)))