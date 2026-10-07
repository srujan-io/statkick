import numpy as np
import pandas as pd


DATA_PATH = "data/raw/players.csv"


def load_and_prepare_data():
    """Load dataset and create the 8-dimensional feature matrix."""

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


def main():

    X, feature_columns = load_and_prepare_data()

    print("========== REDUNDANCY ANALYSIS ==========")

    # --------------------------------------------------
    # 1. Correlation matrix
    # --------------------------------------------------

    correlation_matrix = np.corrcoef(X, rowvar=False)

    correlation_df = pd.DataFrame(
        correlation_matrix,
        index=feature_columns,
        columns=feature_columns
    )

    print("\nCorrelation Matrix:")
    print(correlation_df.round(3))

    # --------------------------------------------------
    # 2. Find strongest relationships
    # --------------------------------------------------

    relationships = []

    for i in range(len(feature_columns)):
        for j in range(i + 1, len(feature_columns)):

            correlation = correlation_matrix[i, j]

            relationships.append(
                (
                    abs(correlation),
                    correlation,
                    feature_columns[i],
                    feature_columns[j]
                )
            )

    relationships.sort(reverse=True)

    print("\nStrongest Feature Relationships:")

    for _, correlation, feature_a, feature_b in relationships[:10]:

        print(
            f"{feature_a} <-> {feature_b}: "
            f"{correlation:.3f}"
        )

    # --------------------------------------------------
    # 3. Check rank after removing each feature
    # --------------------------------------------------

    print("\n========== LEAVE-ONE-FEATURE-OUT RANK ==========")

    full_rank = np.linalg.matrix_rank(X)

    print("Full matrix rank:", full_rank)

    for i, feature in enumerate(feature_columns):

        reduced_X = np.delete(X, i, axis=1)

        reduced_rank = np.linalg.matrix_rank(reduced_X)

        print(
            f"Without {feature}: "
            f"rank = {reduced_rank}"
        )


    # --------------------------------------------------
    # 4. Reduced basis
    # --------------------------------------------------

    reduced_features = [
        "Goals Per 90",
        "Assists Per 90",
        "xG Per 90",
        "xAG Per 90",
        "Progressive Carries Per 90",
        "Progressive Passes Per 90",
        "Progressive Receives Per 90",
    ]

    reduced_indices = [
        feature_columns.index(feature)
        for feature in reduced_features
    ]

    reduced_X = X[:, reduced_indices]

    reduced_rank = np.linalg.matrix_rank(reduced_X)

    print("\n========== REDUCED FEATURE BASIS ==========")

    print("\nRemoved feature:")
    print("- Non-Penalty Goals Per 90")

    print("\nSelected features:")

    for i, feature in enumerate(reduced_features, start=1):
        print(f"{i}. {feature}")

    print("\nReduced matrix shape:")
    print(reduced_X.shape)

    print("\nReduced matrix rank:")
    print(reduced_rank)

    print("\nReduced basis is linearly independent:",
          reduced_rank == len(reduced_features))


if __name__ == "__main__":
    main()