import numpy as np
import pandas as pd


DATA_PATH = "data/raw/players.csv"


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

    return X, feature_columns


def standardize(X):
    """Standardize each feature to mean 0 and standard deviation 1."""

    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0, ddof=1)

    Z = (X - mean) / std

    return Z, mean, std


def covariance_matrix(Z):
    """
    Compute covariance matrix:

        C = (1 / (n - 1)) Z^T Z
    """

    n = Z.shape[0]

    C = (Z.T @ Z) / (n - 1)

    return C


def eigen_analysis(C):
    """
    Compute eigenvalues and eigenvectors
    of the symmetric covariance matrix.
    """

    eigenvalues, eigenvectors = np.linalg.eigh(C)

    # Sort from largest eigenvalue to smallest
    order = np.argsort(eigenvalues)[::-1]

    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]

    return eigenvalues, eigenvectors


def main():

    # --------------------------------------------------
    # 1. Load data
    # --------------------------------------------------

    X, feature_columns = load_and_prepare_data()

    print("Original matrix shape:")
    print(X.shape)

    # --------------------------------------------------
    # 2. Standardize data
    # --------------------------------------------------

    Z, mean, std = standardize(X)

    print("\nStandardized matrix shape:")
    print(Z.shape)

    print("\nFeature means after standardization:")

    print(np.mean(Z, axis=0))

    print("\nFeature standard deviations after standardization:")

    print(np.std(Z, axis=0, ddof=1))

    # --------------------------------------------------
    # 3. Construct covariance matrix
    # --------------------------------------------------

    C = covariance_matrix(Z)

    print("\nCovariance matrix shape:")
    print(C.shape)

    print("\nCovariance matrix:")

    covariance_df = pd.DataFrame(
        C,
        index=feature_columns,
        columns=feature_columns
    )

    print(covariance_df.round(4))

    # --------------------------------------------------
    # 4. Verify covariance matrix is symmetric
    # --------------------------------------------------

    symmetry_error = np.linalg.norm(C - C.T)

    print("\nCovariance matrix symmetry error:")
    print(symmetry_error)

    # --------------------------------------------------
    # 5. Compute eigenvalues and eigenvectors
    # --------------------------------------------------

    eigenvalues, eigenvectors = eigen_analysis(C)

    print("\nEigenvalues:")

    for i, value in enumerate(eigenvalues, start=1):

        print(
            f"λ{i} = {value:.6f}"
        )

    # --------------------------------------------------
    # 6. Explained variance
    # --------------------------------------------------

    total_variance = np.sum(eigenvalues)

    explained_variance = (
        eigenvalues / total_variance
    )

    cumulative_variance = np.cumsum(
        explained_variance
    )

    print("\nExplained variance:")

    for i in range(len(eigenvalues)):

        print(
            f"PC{i + 1}: "
            f"{explained_variance[i] * 100:.2f}%"
        )

    print("\nCumulative explained variance:")

    for i in range(len(eigenvalues)):

        print(
            f"First {i + 1} PC(s): "
            f"{cumulative_variance[i] * 100:.2f}%"
        )

    # --------------------------------------------------
    # 7. Display eigenvectors
    # --------------------------------------------------

    print("\nEigenvectors / Principal Directions:")

    eigenvector_df = pd.DataFrame(
        eigenvectors,
        index=feature_columns,
        columns=[
            f"PC{i + 1}"
            for i in range(len(eigenvalues))
        ]
    )

    print(eigenvector_df.round(4))

    # --------------------------------------------------
    # 8. Verify eigenvalue equation
    # --------------------------------------------------

    print("\nEigenvalue equation verification:")

    for i in range(len(eigenvalues)):

        v = eigenvectors[:, i]
        lam = eigenvalues[i]

        left = C @ v
        right = lam * v

        error = np.linalg.norm(
            left - right
        )

        print(
            f"PC{i + 1}: "
            f"||Cv - λv|| = {error:.10e}"
        )

    # --------------------------------------------------
    # 9. Verify eigenvectors are orthonormal
    # --------------------------------------------------

    orthogonality = (
        eigenvectors.T @ eigenvectors
    )

    print("\nEigenvector orthogonality check:")

    print(
        np.round(
            orthogonality,
            6
        )
    )


if __name__ == "__main__":
    main()