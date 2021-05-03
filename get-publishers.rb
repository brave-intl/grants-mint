# easiest to do this part in the rail console
require 'securerandom'
require 'bigdecimal'
require 'date'

ActiveRecord::Base.logger.level = 1
emails = [
  "donghoe.kim+creator16@bitflyer.com"
]

settlement_id = SecureRandom.uuid
now = Time.now
id_namespace = '7111abf4-0cd1-4e70-88a6-ebc03d5fc68b'
result = Publisher.where(:email => emails).inject([]) do |memo, publisher|
  balances = PublisherBalanceGetter.new(publisher: publisher).perform
  channelResults = publisher.channels.inject([]) do |memo2, channel|
    channel_identifier = channel.details.channel_identifier
    balance = balances.find do |balance|
      balance["account_id"] == channel_identifier
    end
    bal = balance["balance"]
    fee = (BigDecimal(bal) / 20)
    bat = (BigDecimal(bal) - fee).truncate(18).to_s
    fees = fee.truncate(18).to_s
    result = []
    deposit_id = ""
    if channel.deposit_id.present?
      deposit_id = channel.deposit_id
    end
    tx_type = "contribution"
    if balance["account_id"].include?("publishers#uuid:")
      tx_type = "referral"
    end
    puts balance["account_id"] + " has " + bat.to_s + " BAT"
    if bat.to_i != 0
      result = [{
        bat: bat,
        fees: fees,
        owner: "publishers#uuid:" + publisher.id,
        owner_state: "active",
        channel_type: channel_identifier.include?('twitter') ? "TwitterChannelDetails" : (channel_identifier.include?('youtube') ? "YoutubeChannelDetails" : ("SiteChannelDetails")),
        id: Digest::UUID.uuid_v5(id_namespace, publisher.id + ":" + deposit_id + ":" + channel_identifier),
        email: publisher.email,
        created_at: now.to_datetime,
        inserted_at: now.to_datetime,
        address: channel.deposit_id,
        publisher: channel_identifier,
        url: channel_identifier,
        type: tx_type,
        payout_report_id: settlement_id,
        wallet_country_code: "JP",
        wallet_provider: "3",
        wallet_provider_id: "bitflyer#id:" + deposit_id
      }]
    end
    memo2 = memo2.concat(result)
  end
  memo = memo.concat(channelResults)
end
puts result.to_json # may need to run by itself so that everything prints out. put the whole string (including quotes into `creators-settlement-string.json` and run parse-settlements)
File.open("settlements.json") {|f| f.write(result.to_json) }.

ActiveRecord::Base.logger.level = 0