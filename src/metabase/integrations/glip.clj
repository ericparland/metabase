(ns metabase.integrations.glip
  (:require [clojure.tools.logging :as log]
            [cheshire.core :as json]
            [clj-http.client :as http]
            [metabase.models.setting :as setting, :refer [defsetting]]
            [metabase.util :as u]))


;; Define settings which captures our Glip credentials and group to post to
(defsetting glip-login "Glip login (usually comes in a form of email)")
(defsetting glip-password "Glip password")
;TODO:this probably shouldn't go to settings
;(defsetting glip-group-id "Glip group id")

(def ^:private ^:const ^String glip-api-base-url "https://api.glip.com")

(defn glip-configured?
  "Is Glip integration configured?"
  []
  (boolean (seq (glip-password))))

(def cs (clj-http.cookies/cookie-store))

;;TODO: refactor
(defn groups-list []
  "Calls Glip api `index` function and returns the list of available channels."
  (log/warn (u/pprint-to-str 'red (str (glip-login) (glip-password))))
  (http/put (str glip-api-base-url "/login") {:form-params {
                                                             :email (glip-login)
                                                             :password (glip-password)}
                                              :cookie-store cs
                                              :content-type :json})
  (:teams (json/parse-string (:body (http/get (str glip-api-base-url "/index") {:cookie-store cs :debug :true})) keyword)))

;;TODO: rewrite
;(def ^{:arglists '([& {:as args}])} users-list
;  "Calls Slack api `users.list` function and returns the list of available users."
;  (comp :members (partial GET :users.list)))

(defn regenerate-cookie [] (http/put (str glip-api-base-url "/login") {:form-params {
                                                                                      :email (glip-login)
                                                                                      :password (glip-password)}
                                                                       :cookie-store cs
                                                                       :content-type :json}))

(defn upload-and-post-file!
  "Calls Glip api `upload` function and uploads and posts file."
  [file filename]
  (log/warn (u/pprint-to-str group-id))
  (http/put (str glip-api-base-url "/login") {:form-params {
                                                             :email (glip-login)
                                                             :password (glip-password)}
                                              :cookie-store cs
                                              :content-type :json})
  (let [response (http/post (str glip-api-base-url "/upload") {:multipart [ {:name "file",     :content file}
                                                                            {:name "filename", :content filename}]
                                                               :cookie-store cs
                                                               :debug :true})]
    (let [json-response  (json/parse-string  (:body response) keyword)]
      (let	 [json-parsed (first json-response)]
        (if (= 200 (:status response))
            (http/post (str glip-api-base-url "/file") {:form-params {:creator_id (:creator_id json-parsed)
                                                                      :group_id  2995298310
                                                                      :name filename
                                                                      :versions [{
                                                                                   :download_url (:download_url json-parsed)
                                                                                   :size (:size json-parsed)
                                                                                   :stored_file_id (:_id json-parsed)
                                                                                   :url (:storage_url json-parsed)}]}
                                                        :content-type :json
                                                        :cookie-store cs
                                                        :debug :true})
            (log/warn "Error uploading file to Slack:" (u/pprint-to-str json-parsed)))))))


(defn post-chat-message!
  "Calls Glip api `post` function and posts a message to a given group.
   ATTACHMENTS should be serialized JSON."
  [group-id text-or-nil]
  (let [my-cs (clj-http.cookies/cookie-store)]
  (http/put (str glip-api-base-url "/login") {:form-params {
                                                             :email (glip-login)
                                                             :password (glip-password)}
                                              :cookie-store my-cs
                                              :debug :true
                                              :content-type :json})
  (http/post (str glip-api-base-url "/post")
             {:form-params
                            {:group_id    group-id
                             :text        text-or-nil}
              :cookie-store my-cs
              :debug :true
              :content-type :json})))







