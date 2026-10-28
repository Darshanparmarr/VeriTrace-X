"""Preprocessing + candidate model builders.

All preprocessing lives INSIDE the sklearn Pipeline so it is fit on the training
split only (no leakage) and travels with the saved artifact — the backend just
calls `pipeline.predict_proba` on raw feature frames.
"""
from __future__ import annotations

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

from .features import CATEGORICAL, NUMERIC_FEATURES


def build_preprocessor() -> ColumnTransformer:
    numeric = Pipeline(
        steps=[
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]
    )
    categorical = Pipeline(
        steps=[
            ("impute", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", min_frequency=0.01)),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("num", numeric, NUMERIC_FEATURES),
            ("cat", categorical, CATEGORICAL),
        ],
        remainder="drop",
        verbose_feature_names_out=True,
    )


def candidate_models(pos_weight: float) -> dict[str, object]:
    """Candidate classifiers. Class imbalance handled per-model."""
    return {
        "logistic_regression": LogisticRegression(
            class_weight="balanced", max_iter=1000, n_jobs=None, random_state=42
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=200,
            # Bounded depth: regularizes AND keeps SHAP (TreeExplainer) fast enough
            # for both training-time global importance and per-request local explanations.
            max_depth=12,
            class_weight="balanced",
            n_jobs=-1,
            random_state=42,
        ),
        "xgboost": XGBClassifier(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            scale_pos_weight=pos_weight,  # imbalance handling for XGBoost
            eval_metric="aucpr",
            tree_method="hist",
            random_state=42,
            verbosity=0,
        ),
    }


def make_pipeline(estimator) -> Pipeline:
    return Pipeline(steps=[("pre", build_preprocessor()), ("clf", estimator)])
