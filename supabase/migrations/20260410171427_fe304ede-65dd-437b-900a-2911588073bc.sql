UPDATE estimates SET fleet_6t_cost = NULL WHERE COALESCE(total_weight_ton, weight_ton, 0) > 6;
UPDATE estimates SET fleet_9t_cost = NULL WHERE COALESCE(total_weight_ton, weight_ton, 0) > 9;
UPDATE estimates SET fleet_15t_cost = NULL WHERE COALESCE(total_weight_ton, weight_ton, 0) > 15;