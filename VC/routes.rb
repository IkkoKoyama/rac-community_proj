Rails.application.routes.draw do
  get 'manage/manager'
  get 'login/index'
  get '/' => 'login#index'

  get '/home' => 'home#home'
  get '/manual' => 'home#manual'
  get '/search' => 'home#search'
  get '/my_page' => 'home#my_page'
  get '/my_page_edit' => 'detail#my_page_edit'

  get '/user_page' => 'detail#user_page'
  get '/club_page' => 'detail#club_page'
  get '/event_page' => 'detail#event_page'
  get '/event_users' => 'detail#event_users'
  get '/event_comments' => 'detail#event_comments'

  get '/manager_home' => 'manage#manager'


  post '/login_action' => 'login#login_action'
  post '/logout_action' => 'login#logout_action'

  post '/change_password' => 'ajax#change_password'
  get '/ajax/ajax_api' => 'ajax#ajaxAPIAction'
  get '*anything' => 'error#routing_error'
end
