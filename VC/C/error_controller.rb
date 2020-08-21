class ErrorController < ApplicationController
  before_action :authenticate_user
  def routing_error
  end
end
