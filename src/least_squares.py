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


def gram_schmidt_rows(X, tolerance=1e-10):
    """
    Construct an orthonormal basis for the row space of X.

    Each player is a vector in R^7, so the resulting
    basis vectors also belong to R^7.
    """

    basis = []

    for row in X:

        u = row.copy()

        for q in basis:

            projection = (
                np.dot(u, q)
                / np.dot(q, q)
            ) * q

            u = u - projection

        if np.linalg.norm(u) > tolerance:

            u = u / np.linalg.norm(u)

            basis.append(u)

        if len(basis) == X.shape[1]:
            break

    return np.column_stack(basis)


def least_squares(A, x):
    """
    Solve the least-squares problem:

        minimize ||Ac - x||^2

    using the normal equations:

        A^T A c = A^T x
    """

    ATA = A.T @ A
    ATx = A.T @ x

    coefficients = np.linalg.solve(ATA, ATx)

    return coefficients


def main():

    # --------------------------------------------------
    # 1. Load data
    # --------------------------------------------------

    X, feature_columns = load_and_prepare_data()

    print("Original matrix shape:")
    print(X.shape)

    # --------------------------------------------------
    # 2. Construct orthonormal basis in R^7
    # --------------------------------------------------

    Q = gram_schmidt_rows(X)

    print("\nOrthonormal basis shape:")
    print(Q.shape)

    # --------------------------------------------------
    # 3. Choose a 2D approximation subspace
    # --------------------------------------------------

    A = Q[:, :2]

    print("\nApproximation matrix A shape:")
    print(A.shape)

    print("\nA represents a 2D subspace of R^7.")

    # --------------------------------------------------
    # 4. Select one player
    # --------------------------------------------------

    player_index = 0

    x = X[player_index]

    print("\nOriginal player vector:")
    print(x)

    # --------------------------------------------------
    # 5. Solve least-squares problem
    # --------------------------------------------------

    coefficients = least_squares(A, x)

    print("\nLeast-squares coefficients:")
    print(coefficients)

    # --------------------------------------------------
    # 6. Reconstruct the player vector
    # --------------------------------------------------

    x_hat = A @ coefficients

    print("\nApproximated player vector:")
    print(x_hat)

    # --------------------------------------------------
    # 7. Calculate residual
    # --------------------------------------------------

    residual = x - x_hat

    print("\nResidual vector:")
    print(residual)

    # --------------------------------------------------
    # 8. Calculate errors
    # --------------------------------------------------

    residual_norm = np.linalg.norm(residual)

    original_norm = np.linalg.norm(x)

    relative_error = residual_norm / original_norm

    print("\nResidual norm:")
    print(residual_norm)

    print("\nRelative approximation error:")
    print(relative_error)

    # --------------------------------------------------
    # 9. Verify orthogonal residual
    # --------------------------------------------------

    print("\nResidual dot products with basis vectors:")

    for i in range(A.shape[1]):

        dot_product = np.dot(
            residual,
            A[:, i]
        )

        print(
            f"residual · a{i + 1} = "
            f"{dot_product:.10f}"
        )


if __name__ == "__main__":
    main()