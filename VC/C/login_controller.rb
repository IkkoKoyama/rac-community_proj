class LoginController < ApplicationController
  layout 'login'

  before_action :currenter_user,{only:[:index]}
  protect_from_forgery :except => [:login_action]

  def index
      @s3_path = ENV['S3_DB_URL']
  end

  require 'net/http'

  def login_action
    @email = params[:email]
    @password = params[:password]
    url = URI.parse(ENV['DB_SERVER_URL'])
    req = Net::HTTP::Post.new(url.path)
    req.set_form_data({"email" => @email, "password" => @password})
    response = Net::HTTP.new(url.host, url.port).start do |http|
      http.request(req)
    end
    case response
      when Net::HTTPSuccess
        @result = JSON.parse(response.body)
        exists =  @result["db_i_dataExists"]
        if exists
          session[:db] =
            '{"id":"' + @result["user_id"] +
            '","club_id":"' + @result["club_id"] +
            '","district_id":"' + @result["district_id"] +
            '","user_level":"' + @result["user_level"] +
            '"}'
          session[:user_id] = @result["user_id"]
          session[:user_name] = @result["user_name"]
          session[:user_level] = @result["user_level"]
          redirect_to("/home")
        else
          session[:db] = nil
          session[:user_id] = nil
          session[:user_name] = nil
          session[:user_level] = nil
          flash[:notice_nega] = "メールアドレスまたはパスワードが間違っています"
          redirect_to("/")
        end
        when Net::HTTPRedirection
      else
    end
  end

  def logout_action
    session[:db] = nil
    session[:user_id] = nil
    session[:user_name] = nil
    session[:user_level] = nil
    redirect_to("/")
  end
end
