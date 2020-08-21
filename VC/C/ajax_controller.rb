class AjaxController < ApplicationController
  before_action :authenticate_user

  require 'net/http'

  def change_password
    @pass_0 = params[:password_0]
    @pass_1 = params[:password_1]
    @pass_2 = params[:password_2]

    rawURL = "http://localhost:8000/user_password_ajax"
    url = URI.parse(rawURL)
    req = Net::HTTP::Post.new(url.path)
    req.set_form_data({"pass_0" => @pass_0,"pass_1" => @pass_1,"pass_2" => @pass_2,"db" => session[:db]})
    response = Net::HTTP.new(url.host, url.port).start do |http|
      http.request(req)
    end
    case response
      when Net::HTTPSuccess
        @result = JSON.parse(response.body)
        exists =  @result["dataExists"]
        if exists == 1
          session[:db] = nil
          session[:user_id] = nil
          session[:user_name] = nil
          session[:user_level] = nil
          flash[:notice_nega] = "新しいパスワードでログインしてください"
          redirect_to("/")
        elsif exists == 2
          flash[:notice_nega] = "現在のパスワードが間違っています"
          redirect_to("/my_page_edit")
        elsif exists == 3
          flash[:notice_nega] = "新しいパスワードが一致しません"
          redirect_to("/my_page_edit")
        end
        when Net::HTTPRedirection
      else
    end
  end

  def api_gate_open(sender1,sender2,sender3)
    rawURL = "http://localhost:8000/" + sender1
    url = URI.parse(rawURL)
    req = Net::HTTP::Post.new(url.path)
    req.set_form_data({"sender" => sender2,"db" => sender3})
    response = Net::HTTP.new(url.host, url.port).start do |http|
      http.request(req)
    end
    case response
      when Net::HTTPSuccess
      @result = JSON.parse(response.body)
      data = {:results => @result}
      respond_to do |f|
        f.json {render json: data}
      end
      when Net::HTTPRedirection
      else
    end
  end

  def ajaxAPIAction
    api_gate_open(params[:sender1],params[:sender2],session[:db])
  end
end
