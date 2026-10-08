import os
import numpy as np
import pandas as pd


DATA_PATH = "data/raw/players.csv"
OUTPUT_DIR = "results/analysis"
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "pca_player_scores.csv"
)


def load_and_prepare_data():
    """Load dataset and create the reduced 7-feature matrix."""

    df = pd.read_csv(DATA_PATH)

    df["Minutes"] = (
        df["Minutes"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .astype(int)
    )

    df = df[df["Minutes"] > 0].copy()

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
        "xG Per 90",
        "xAG Per 90",
        "Progressive Carries Per 90",
        "Progressive Passes Per 90",
        "Progressive Receives Per 90",
    ]

    X = df[feature_columns].to_numpy(dtype=float)

    metadata = df[
        [
            "Player",
            "Nation",
            "Position",
            "Age",
            "Minutes"
        ]
    ].copy()

    return X, metadata, feature_columns


def standardize(X):
    """Standardize features to mean 0 and standard deviation 1."""

    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0, ddof=1)

    Z = (X - mean) / std

    return Z, mean, std


def covariance_matrix(Z):
    """Calculate the covariance matrix."""

    n = Z.shape[0]

    return (Z.T @ Z) / (n - 1)


def eigen_decomposition(C):
    """Calculate and sort eigenvalues and eigenvectors."""

    eigenvalues, eigenvectors = np.linalg.eigh(C)

    order = np.argsort(eigenvalues)[::-1]

    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]

    return eigenvalues, eigenvectors


def calculate_pca_scores(Z, eigenvectors):
    """
    Transform standardized player vectors into
    principal-component coordinates.

        Y = ZQ
    """

    return Z @ eigenvectors


def find_similar_players(
    player_index,
    pca_scores,
    metadata,
    n_components=5,
    top_n=5
):
    """
    Find players closest to the selected player
    in PCA space.
    """

    target = pca_scores[
        player_index,
        :n_components
    ]

    distances = np.linalg.norm(
        pca_scores[:, :n_components] - target,
        axis=1
    )

    # Don't compare player with themselves
    target_name = metadata.iloc[player_index]["Player"]

    same_player = (
        metadata["Player"] == target_name
    ).to_numpy()

    distances[same_player] = np.inf

    nearest_indices = np.argsort(distances)[:top_n]

    results = metadata.iloc[
        nearest_indices
    ].copy()

    results["Distance"] = distances[
        nearest_indices
    ]

    return results


def main():

    # --------------------------------------------------
    # 1. Load data
    # --------------------------------------------------

    X, metadata, feature_columns = (
        load_and_prepare_data()
    )

    print("========== STATKICK FINAL APPLICATION ==========")

    print("\nPlayers:")
    print(len(X))

    print("\nFeatures:")
    print(len(feature_columns))

    # --------------------------------------------------
    # 2. Standardize
    # --------------------------------------------------

    Z, mean, std = standardize(X)

    # --------------------------------------------------
    # 3. Covariance matrix
    # --------------------------------------------------

    C = covariance_matrix(Z)

    # --------------------------------------------------
    # 4. Eigen decomposition
    # --------------------------------------------------

    eigenvalues, eigenvectors = (
        eigen_decomposition(C)
    )

    # --------------------------------------------------
    # 5. PCA scores
    # --------------------------------------------------

    pca_scores = calculate_pca_scores(
        Z,
        eigenvectors
    )

    # --------------------------------------------------
    # 6. Explained variance
    # --------------------------------------------------

    explained_variance = (
        eigenvalues / np.sum(eigenvalues)
    )

    cumulative_variance = np.cumsum(
        explained_variance
    )

    print("\n========== PCA VARIANCE ==========")

    for i in range(len(eigenvalues)):

        print(
            f"PC{i + 1}: "
            f"{explained_variance[i] * 100:.2f}% "
            f"(cumulative: "
            f"{cumulative_variance[i] * 100:.2f}%)"
        )

    # --------------------------------------------------
    # 7. PCA score matrix
    # --------------------------------------------------

    print("\nPCA score matrix shape:")
    print(pca_scores.shape)

    # --------------------------------------------------
    # 8. Create results dataframe
    # --------------------------------------------------

    pca_columns = [
        f"PC{i + 1}"
        for i in range(pca_scores.shape[1])
    ]

    pca_df = pd.DataFrame(
        pca_scores,
        columns=pca_columns
    )

    result_df = pd.concat(
        [
            metadata.reset_index(drop=True),
            pca_df
        ],
        axis=1
    )

    # --------------------------------------------------
    # 9. Save PCA results
    # --------------------------------------------------

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    result_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\nSaved PCA results to:")
    print(OUTPUT_FILE)

    # --------------------------------------------------
    # 10. Select a player
    # --------------------------------------------------

    player_name = "Mohamed Salah"

    matches = metadata[
        metadata["Player"].str.lower()
        == player_name.lower()
    ]

    if len(matches) == 0:

        print(
            f"\nPlayer not found: {player_name}"
        )

        return

    player_index = matches.index[0]

    player = metadata.iloc[player_index]

    # --------------------------------------------------
    # 11. Display player
    # --------------------------------------------------

    print("\n========== PLAYER ANALYSIS ==========")

    print(
        f"\nPlayer: {player['Player']}"
    )

    print(
        f"Position: {player['Position']}"
    )

    print(
        f"Minutes: {player['Minutes']}"
    )

    print("\nPCA coordinates:")

    for i in range(5):

        print(
            f"PC{i + 1}: "
            f"{pca_scores[player_index, i]:.4f}"
        )

    # --------------------------------------------------
    # 12. Similar players
    # --------------------------------------------------

    similar = find_similar_players(
        player_index,
        pca_scores,
        metadata,
        n_components=5,
        top_n=5
    )

    print("\n========== SIMILAR PLAYERS ==========")

    print(
        similar[
            [
                "Player",
                "Position",
                "Distance"
            ]
        ].to_string(index=False)
    )

    # --------------------------------------------------
    # 13. Final summary
    # --------------------------------------------------

    print("\n========== FINAL SUMMARY ==========")

    print(
        "2D visualization variance: "
        f"{cumulative_variance[1] * 100:.2f}%"
    )

    print(
        "5D similarity variance: "
        f"{cumulative_variance[4] * 100:.2f}%"
    )

    print(
        "\nStatKick successfully transformed "
        "football performance data into PCA space "
        "and identified statistically similar players."
    )


if __name__ == "__main__":
    main()