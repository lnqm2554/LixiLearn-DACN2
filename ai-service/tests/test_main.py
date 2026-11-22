from contextlib import redirect_stdout
from io import StringIO
import unittest
from unittest.mock import patch

from pydantic import ValidationError

import main
from main import FeatureInput, PredictionOutput, predict_learning_performance


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


class PredictionTests(unittest.TestCase):
    def setUp(self):
        self.payload = FeatureInput(
            user_id="test-user",
            card_id="test-card",
            difficulty_level=2,
            recent_accuracy=0.8,
            avg_response_time_ms=2000,
            consecutive_correct=2,
            streak=3,
            review_count=1,
        )

    def test_uses_loaded_model_and_preserves_feature_order(self):
        expected_features = [
            "difficulty_level",
            "recent_accuracy",
            "avg_response_time_ms",
            "consecutive_correct",
            "streak",
            "review_count",
            "accuracy_per_second",
            "retention_momentum",
            "confidence_index",
            "difficulty_challenge",
        ]

        class FakeModel:
            def predict_proba(self, sample):
                self.assert_feature_order = list(sample.columns)
                return [[0.1, 0.9]]

            def predict(self, sample):
                return [1]

        fake_model = FakeModel()
        bundle = {"model": fake_model, "feature_names": expected_features}
        with patch.object(main, "pipeline_bundle", bundle):
            result = predict_learning_performance(self.payload)

        self.assertEqual(fake_model.assert_feature_order, expected_features)
        self.assertEqual(result.success_probability, 0.9)
        self.assertEqual(result.recommended_action, "challenge_mode")
        self.assertEqual(result.model_version, "RandomForest-Tuned-v2.0")

    def test_returns_bounded_heuristic_when_model_is_unavailable(self):
        with patch.object(main, "pipeline_bundle", None):
            result = predict_learning_performance(self.payload)

        self.assertEqual(result.model_version, "Heuristic-Fallback")
        self.assertGreaterEqual(result.success_probability, 0)
        self.assertLessEqual(result.success_probability, 1)

    def test_cors_credentials_are_disabled_for_wildcard_origins(self):
        cors_middleware = next(
            middleware
            for middleware in main.app.user_middleware
            if middleware.cls.__name__ == "CORSMiddleware"
        )
        self.assertEqual(cors_middleware.kwargs["allow_origins"], ["*"])
        self.assertFalse(cors_middleware.kwargs["allow_credentials"])

    def test_selects_review_action_for_low_model_probability(self):
        class FakeModel:
            def predict_proba(self, sample):
                return [[0.7, 0.3]]

            def predict(self, sample):
                return [0]

        bundle = {
            "model": FakeModel(),
            "feature_names": [
                "difficulty_level",
                "recent_accuracy",
                "avg_response_time_ms",
                "consecutive_correct",
                "streak",
                "review_count",
                "accuracy_per_second",
                "retention_momentum",
                "confidence_index",
                "difficulty_challenge",
            ],
        }
        with patch.object(main, "pipeline_bundle", bundle):
            result = predict_learning_performance(self.payload)

        self.assertEqual(result.recommended_action, "review_now")


class ModelStartupTests(unittest.TestCase):
    def test_model_load_failure_logs_safely_on_legacy_windows_encodings(self):
        output = StringIO()
        with (
            patch.object(main.os.path, "exists", return_value=True),
            patch.object(main.joblib, "load", side_effect=ValueError("模型加载失败")),
            redirect_stdout(output),
        ):
            main.load_ai_model()

        message = output.getvalue()
        self.assertTrue(message.isascii())
        self.assertIn("using heuristic fallback", message)
        self.assertIn("\\u6a21", message)


if __name__ == "__main__":
    unittest.main()
