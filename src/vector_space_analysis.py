import numpy as np
import pandas as pd


DATA_PATH = "data/raw/players.csv"


def load_and_prepare_data():
    """Load dataset and construct the 8-dimensional feature matrix."""

    df = pd.read_csv(DATA_PATH)

    # Convert Minutes to integer
    df["Minutes"] = (
        df["Minutes"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .astype(int)
    )

    # Remove players with zero minutes
    df = df[df["Minutes"] > 0].copy()

    # Progressive statistics per 90
    df["Progressive Carries Per 90"] = (
        df["Progressive Carries"] / df["Minutes"]
    ) * 90

    df["Progressive Passes Per 90"] = (
        df["Progressive Passes"] / df["Minutes"]
    ) * 90

    df["Progressive Receives Per 90"] = (
        df["Progressive Receives"] / df["Minutes"]
    ) * 90

    feature_columns = [
        "Goals Per 90",
        "Assists Per 90",
        "Non-Penalty Goals Per 90",
        "xG Per 90",
        "xAG Per 90",
        "Progressive Carries Per 90",
        "Progressive Passes Per 90",
        "Progressive Receives Per 90",
    ]

    X = df[feature_columns].to_numpy(dtype=float)

    return X, feature_columns


def analyze_space(X, feature_columns):

    # Rank
    rank = np.linalg.matrix_rank(X)

    # Number of feature dimensions
    n = X.shape[1]

    # Rank-nullity theorem
    nullity = n - rank

    print("========== VECTOR SPACE ANALYSIS ==========")

    print("\nMatrix shape:")
    print(X.shape)

    print("\nAmbient player space:")
    print("R^8")

    print("\nNumber of dimensions:")
    print(n)

    print("\nRank:")
    print(rank)

    print("\nNullity:")
    print(nullity)

    print("\nBasis for column space:")
    for i, feature in enumerate(feature_columns):
        print(f"{i + 1}. {feature}")

    # --------------------------------------------------
    # Attacking subspace
    # --------------------------------------------------

    attacking_features = [
        "Goals Per 90",
        "Assists Per 90",
        "Non-Penalty Goals Per 90",
        "xG Per 90",
        "xAG Per 90",
    ]

    attacking_indices = [
        feature_columns.index(feature)
        for feature in attacking_features
    ]

    attacking_matrix = X[:, attacking_indices]

    attacking_rank = np.linalg.matrix_rank(attacking_matrix)

    print("\n========== ATTACKING SUBSPACE ==========")

    print("Features:")
    for feature in attacking_features:
        print("-", feature)

    print("\nShape:")
    print(attacking_matrix.shape)

    print("\nDimension:")
    print(attacking_rank)

    # --------------------------------------------------
    # Progression subspace
    # --------------------------------------------------

    progression_features = [
        "Progressive Carries Per 90",
        "Progressive Passes Per 90",
        "Progressive Receives Per 90",
    ]

    progression_indices = [
        feature_columns.index(feature)
        for feature in progression_features
    ]

    progression_matrix = X[:, progression_indices]

    progression_rank = np.linalg.matrix_rank(
        progression_matrix
    )

    print("\n========== PROGRESSION SUBSPACE ==========")

    print("Features:")
    for feature in progression_features:
        print("-", feature)

    print("\nShape:")
    print(progression_matrix.shape)

    print("\nDimension:")
    print(progression_rank)


def main():

    X, feature_columns = load_and_prepare_data()

    analyze_space(X, feature_columns)


if __name__ == "__main__":
    main()