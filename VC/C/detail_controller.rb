class DetailController < ApplicationController
  before_action :authenticate_user
  layout 'details'

  def user_page
      @user_id = params[:user_id]
  end
  def club_page
      @club_id = params[:club_id]
  end
  def event_page
    @event_id = params[:event_id]
  end
  def event_users
    @event_id = params[:event_id]
  end
  def event_comments
    @event_id = params[:event_id]
  end
end
