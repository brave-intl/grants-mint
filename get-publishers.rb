ActiveRecord::Base.logger.level = 1
emails = [
  "example@email.com",
  "example2@email.com"
]
puts "publisher_id,email,deposit_id,channel_identifier"
pubs = Publisher.where(:email => emails).each do |publisher|
  publisher.channels.each do |channel|
    puts publisher.id + "," + publisher.email + "," + channel.deposit_id + "," + channel.details.channel_identifier
  end
end
ActiveRecord::Base.logger.level = 0