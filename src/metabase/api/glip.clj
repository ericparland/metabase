(ns metabase.api.glip
  "/api/glip endpoints"
  (:require [compojure.core :refer [PUT]]
            [schema.core :as s]
            [metabase.api.common :refer :all]
            [metabase.config :as config]
            [metabase.integrations.glip :as glip]
            [metabase.models.setting :as setting]
            [metabase.util.schema :as su]))

;TODO: work on this
(defendpoint PUT "/settings"
  "Update Glip related settings. You must be a superuser to do this."
  [:as {{glip-login :glip-login, glip-password :glip-password, :as glip-settings} :body}]
  {glip-login     (s/maybe su/NonBlankString)
   glip-password  (s/maybe su/NonBlankString)}
  (check-superuser)
  (try
    ;; just check that channels.list doesn't throw an exception (a.k.a. that the token works)
    (setting/set-many! glip-settings)
    {:ok true}
    (catch clojure.lang.ExceptionInfo info
           {:status 400, :body (ex-data info)}))

  )

(define-routes)
