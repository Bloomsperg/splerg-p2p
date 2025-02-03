use crate::error::SwapError;

/// Calculates fee amount given an input amount and fee rate in basis points (1 bp = 0.01%)
pub fn calculate_token_fee(amount: u128, fee_basis_points: u16) -> Result<u128, SwapError> {
    if amount == 0 || fee_basis_points == 0 {
        return Ok(0);
    }

    amount
        .checked_mul(fee_basis_points.into())
        .ok_or(SwapError::Overflow)?
        .checked_div(10_000)
        .ok_or(SwapError::Overflow)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_fee_calculation() {
        // 1% fee (100 basis points)
        assert_eq!(calculate_token_fee(10000, 100).unwrap(), 100);

        // 0.5% fee (50 basis points)
        assert_eq!(calculate_token_fee(10000, 50).unwrap(), 50);

        // 0.01% fee (1 basis point)
        assert_eq!(calculate_token_fee(10000, 1).unwrap(), 1);
    }

    #[test]
    fn test_large_numbers() {
        // Testing with 1e18 (common token decimal precision)
        let one_token = 1_000_000_000_000_000_000u128;

        // 0.3% fee (30 basis points)
        assert_eq!(
            calculate_token_fee(one_token, 30).unwrap(),
            3_000_000_000_000_000
        );

        // 1.23% fee (123 basis points)
        let amount = 1_234_567_890_123_456_789u128;
        assert_eq!(
            calculate_token_fee(amount, 123).unwrap(),
            15_185_185_048_518_518
        );
    }

    #[test]
    fn test_edge_cases() {
        // Zero amount
        assert_eq!(calculate_token_fee(0, 100).unwrap(), 0);

        // Zero fee
        assert_eq!(calculate_token_fee(1000, 0).unwrap(), 0);

        // Maximum possible fee (100% = 10000 basis points)
        assert_eq!(calculate_token_fee(100, 10000).unwrap(), 100);

        // Max amount that won't overflow with max fee
        let max_safe_amount = u128::MAX / 10_000;
        assert!(calculate_token_fee(max_safe_amount, 9999).is_ok());

        // Amount that would overflow
        let unsafe_amount = u128::MAX / 9999;
        assert!(calculate_token_fee(unsafe_amount, 10000).is_err());
    }

    #[test]
    fn test_rounding() {
        // When dividing by 10000, we effectively round down
        assert_eq!(calculate_token_fee(9999, 1).unwrap(), 0);
        assert_eq!(calculate_token_fee(10000, 1).unwrap(), 1);
        assert_eq!(calculate_token_fee(10001, 1).unwrap(), 1);
    }
}
