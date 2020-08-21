class HomeController < ApplicationController
  before_action :authenticate_user
  layout 'application'

  def home
  end
  def search
  end
  def my_page
  end
  def manual
  end
end
