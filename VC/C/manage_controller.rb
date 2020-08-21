class ManageController < ApplicationController
  before_action :authenticate_user,:authenticate_manager
  layout 'manager'

  def manager
    @p_select = params[:ps]
    @p_type = params[:pt]
    @s_select = params[:ss]
    @s_type = params[:st]
    @o_select = params[:os]
    @o_id = params[:oi]
  end
end
