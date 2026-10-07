import numpy as np
import pandas as pd


DATA_PATH = "data/raw/players.csv"


def load_and_prepare_data():
    """Load dataset and create the reduced 7-feature matrix."""

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
        "xG Per 90",
        "xAG Per 90",
        "Progressive Carries Per 90",
        "Progressive Passes Per 90",
        "Progressive Receives Per 90",
    ]

    X = df[feature_columns].to_numpy(dtype=float)

    return X, feature_columns


def gram_schmidt(X):
    """
    Apply the Gram-Schmidt process to the columns of X.

    Returns an orthogonal basis Q.
    """

    rows, columns = X.shape

    Q = np.zeros((rows, columns))

    for i in range(columns):

        # Start with the current feature vector
        u = X[:, i].copy()

        # Remove projections onto all previous
        # orthogonal vectors.
        for j in range(i):

            projection = (
                np.dot(X[:, i], Q[:, j])
                / np.dot(Q[:, j], Q[:, j])
            ) * Q[:, j]

            u = u - projection

        Q[:, i] = u

    return Q


def main():

    # --------------------------------------------------
    # 1. Load reduced feature matrix
    # --------------------------------------------------

    X, feature_columns = load_and_prepare_data()

    print("Original reduced matrix shape:")
    print(X.shape)

    # --------------------------------------------------
    # 2. Apply Gram-Schmidt
    # --------------------------------------------------

    Q = gram_schmidt(X)

    print("\nOrthogonal basis shape:")
    print(Q.shape)

    # --------------------------------------------------
    # 3. Check orthogonality
    # --------------------------------------------------

    print("\nDot products between orthogonal vectors:")

    for i in range(Q.shape[1]):

        for j in range(i + 1, Q.shape[1]):

            dot_product = np.dot(Q[:, i], Q[:, j])

            print(
                f"u{i + 1} · u{j + 1} = "
                f"{dot_product:.10f}"
            )

    # --------------------------------------------------
    # 4. Check rank
    # --------------------------------------------------

    orthogonal_rank = np.linalg.matrix_rank(Q)

    print("\nRank of orthogonal basis:")
    print(orthogonal_rank)

    # --------------------------------------------------
    # 5. Show first few values
    # --------------------------------------------------

    print("\nFirst 5 rows of orthogonal basis:")

    Q_df = pd.DataFrame(
        Q[:5, :],
        columns=[
            f"u{i + 1}"
            for i in range(Q.shape[1])
        ]
    )

    print(Q_df)


if __name__ == "__main__":
    main()