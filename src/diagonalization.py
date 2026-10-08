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
    """Standardize each feature."""

    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0, ddof=1)

    Z = (X - mean) / std

    return Z


def covariance_matrix(Z):
    """Calculate C = (1 / (n - 1)) Z^T Z."""

    n = Z.shape[0]

    return (Z.T @ Z) / (n - 1)


def eigen_decomposition(C):
    """Calculate and sort eigenvalues and eigenvectors."""

    eigenvalues, eigenvectors = np.linalg.eigh(C)

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
    # 2. Standardize
    # --------------------------------------------------

    Z = standardize(X)

    print("\nStandardized matrix shape:")
    print(Z.shape)

    # --------------------------------------------------
    # 3. Covariance matrix
    # --------------------------------------------------

    C = covariance_matrix(Z)

    print("\nCovariance matrix shape:")
    print(C.shape)

    # --------------------------------------------------
    # 4. Eigen decomposition
    # --------------------------------------------------

    eigenvalues, Q = eigen_decomposition(C)

    print("\nEigenvalues:")

    for i, value in enumerate(eigenvalues, start=1):
        print(f"λ{i} = {value:.6f}")

    # --------------------------------------------------
    # 5. Construct diagonal matrix Lambda
    # --------------------------------------------------

    Lambda = np.diag(eigenvalues)

    print("\nDiagonal matrix Lambda:")

    print(
        np.round(
            Lambda,
            4
        )
    )

    # --------------------------------------------------
    # 6. Verify Q is orthogonal
    # --------------------------------------------------

    QTQ = Q.T @ Q

    identity = np.eye(Q.shape[1])

    orthogonality_error = np.linalg.norm(
        QTQ - identity
    )

    print("\nQ^T Q:")

    print(
        np.round(
            QTQ,
            6
        )
    )

    print("\nOrthogonality error:")
    print(orthogonality_error)

    # --------------------------------------------------
    # 7. Reconstruct covariance matrix
    # --------------------------------------------------

    C_reconstructed = Q @ Lambda @ Q.T

    print("\nOriginal covariance matrix:")

    print(
        pd.DataFrame(
            C,
            index=feature_columns,
            columns=feature_columns
        ).round(4)
    )

    print("\nReconstructed covariance matrix:")

    print(
        pd.DataFrame(
            C_reconstructed,
            index=feature_columns,
            columns=feature_columns
        ).round(4)
    )

    # --------------------------------------------------
    # 8. Reconstruction error
    # --------------------------------------------------

    reconstruction_error = np.linalg.norm(
        C - C_reconstructed
    )

    print("\nDiagonalization reconstruction error:")
    print(reconstruction_error)

    # --------------------------------------------------
    # 9. Verify diagonalization directly
    # --------------------------------------------------

    diagonalized_C = Q.T @ C @ Q

    diagonalization_error = np.linalg.norm(
        diagonalized_C - Lambda
    )

    print("\nQ^T C Q:")

    print(
        np.round(
            diagonalized_C,
            6
        )
    )

    print("\nDiagonalization error:")
    print(diagonalization_error)


if __name__ == "__main__":
    main()