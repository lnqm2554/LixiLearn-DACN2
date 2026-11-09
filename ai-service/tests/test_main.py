import unittest

from pydantic import ValidationError

from main import FeatureInput, PredictionOutput


class FeatureInputTests(unittest.TestCase):
    def setUp(self):
        self.payload = {
            "user_id": "test-user",
            "card_id": "test-card",
            "difficulty_level": 2,
            "recent_accuracy": 0.8,
            "avg_response_time_ms": 2000,
            "consecutive_correct": 2,
            "streak": 3,
            "review_count": 1,
        }

    def test_accepts_valid_learning_features(self):
        result = FeatureInput.model_validate(self.payload)
        self.assertEqual(result.card_id, "test-card")

    def test_rejects_values_outside_model_training_domain(self):
        for field, value in (
            ("difficulty_level", 4),
            ("recent_accuracy", 1.1),
            ("avg_response_time_ms", 0),
            ("review_count", 0),
        ):
            with self.subTest(field=field):
                with self.assertRaises(ValidationError):
                    FeatureInput.model_validate({**self.payload, field: value})

    def test_rejects_invalid_prediction_output(self):
        with self.assertRaises(ValidationError):
            PredictionOutput(
                card_id="test-card",
                success_probability=1.1,
                predicted_outcome=1,
                recommended_action="challenge_mode",
                model_version="test",
                key_factor="test",
            )

        with self.assertRaises(ValidationError):
            PredictionOutput(
                card_id="test-card",
                success_probability=0.9,
                predicted_outcome=1,
                recommended_action="unknown",
                model_version="test",
                key_factor="test",
            )


if __name__ == "__main__":
    unittest.main()
