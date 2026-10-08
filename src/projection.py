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
    """Apply Gram-Schmidt to the columns of X."""

    rows, columns = X.shape

    Q = np.zeros((rows, columns))

    for i in range(columns):

        u = X[:, i].copy()

        for j in range(i):

            projection = (
                np.dot(X[:, i], Q[:, j])
                / np.dot(Q[:, j], Q[:, j])
            ) * Q[:, j]

            u = u - projection

        Q[:, i] = u

    return Q


def project_vector(vector, basis):
    """
    Project a vector onto a subspace whose
    basis vectors are the columns of basis.
    """

    projection = np.zeros_like(vector)

    for i in range(basis.shape[1]):

        u = basis[:, i]

        coefficient = (
            np.dot(vector, u)
            / np.dot(u, u)
        )

        projection += coefficient * u

    return projection


def main():

    # --------------------------------------------------
    # 1. Load feature matrix
    # --------------------------------------------------

    X, feature_columns = load_and_prepare_data()

    print("Original matrix shape:")
    print(X.shape)

    # --------------------------------------------------
    # 2. Construct orthogonal basis
    # --------------------------------------------------

    Q = gram_schmidt(X)

    print("\nOrthogonal basis shape:")
    print(Q.shape)

    # --------------------------------------------------
    # 3. Select a 2D subspace
    # --------------------------------------------------

    basis_2d = Q[:, :2]

    print("\nProjection subspace:")
    print("span(u1, u2)")

    print("\nSubspace dimension:")
    print(basis_2d.shape[1])

    # --------------------------------------------------
    # 4. Project each feature vector
    # --------------------------------------------------

    projected_features = []

    for i in range(X.shape[1]):

        feature_vector = X[:, i]

        projected_vector = project_vector(
            feature_vector,
            basis_2d
        )

        projected_features.append(projected_vector)

    projected_features = np.column_stack(
        projected_features
    )

    # --------------------------------------------------
    # 5. Display projected matrix
    # --------------------------------------------------

    print("\nProjected matrix shape:")
    print(projected_features.shape)

    # --------------------------------------------------
    # 6. Calculate reconstruction error
    # --------------------------------------------------

    error = X - projected_features

    error_norm = np.linalg.norm(error)

    original_norm = np.linalg.norm(X)

    relative_error = error_norm / original_norm

    print("\nTotal projection error:")
    print(error_norm)

    print("\nRelative projection error:")
    print(relative_error)

    # --------------------------------------------------
    # 7. Feature-wise reconstruction error
    # --------------------------------------------------

    print("\nFeature-wise projection error:")

    for i, feature in enumerate(feature_columns):

        feature_error = np.linalg.norm(
            X[:, i] - projected_features[:, i]
        )

        original_feature_norm = np.linalg.norm(
            X[:, i]
        )

        relative_feature_error = (
            feature_error / original_feature_norm
        )

        print(
            f"{feature}: "
            f"{relative_feature_error:.6f}"
        )


if __name__ == "__main__":
    main()