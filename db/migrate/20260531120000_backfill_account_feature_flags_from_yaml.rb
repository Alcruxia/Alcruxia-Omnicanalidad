class BackfillAccountFeatureFlagsFromYaml < ActiveRecord::Migration[7.1]
  def up
    feature_list = YAML.safe_load(Rails.root.join('config/features.yml').read)
    default_names = feature_list
                    .reject { |feature| feature['deprecated'] }
                    .select { |feature| feature.fetch('enabled', false) }
                    .pluck('name')

    Account.find_in_batches(batch_size: 100) do |accounts|
      accounts.each do |account|
        account.enable_features(*default_names)
        account.save!(validate: false)
      end
    end
  end
end
