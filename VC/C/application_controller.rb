class ApplicationController < ActionController::Base
    protect_from_forgery with: :exception
    config.api_only = false
    before_action :set_current_user

    def set_current_user
      @s3_path = ENV['S3_DB_URL']
      if session[:user_id] != nil
        @user_name = session[:user_name]
        @club_id = session[:club_id]
        @current_user_id = session[:user_id]
        @user_level = session[:user_level]
        # permission  7 = rwx, 6 = rw-, 1 = r--
        @user_level = session[:user_level].to_i
        if @user_level == 1
          @permission = 7
        elsif @user_level == 2 || @user_level == 3
          @permission = 6
        else
          @permission = 1
        end
      else
        session[:db] = nil
        session[:user_id] = nil
        session[:user_name] = nil
        session[:user_level] = nil
      end
    end

    def authenticate_user
        if session[:user_id] == nil
            flash[:notice_nega] = "アクセスするにはログインが必要です"
            redirect_to('/')
        end
    end

    def authenticate_manager
        @user_level = session[:user_level].to_i
        if @user_level != 1 && @user_level != 2 && @user_level != 3
            flash[:notice_nega] = "アクセス権限がありません"
            redirect_to('/home')
        end
    end

    def currenter_user
        if session[:user_id] != nil
            redirect_to('/home')
        end
    end
end
