import numpy as np
import pandas as pd


DATA_PATH = "data/raw/players.csv"


def load_and_prepare_data():
    """Load the football dataset and create the feature matrix."""

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

    # Create progressive statistics per 90
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


def rref(matrix, tolerance=1e-10):
    """
    Compute the Reduced Row Echelon Form using
    Gaussian elimination.
    """

    A = matrix.copy().astype(float)

    rows, cols = A.shape

    pivot_row = 0
    pivot_columns = []

    for col in range(cols):

        # Find the row with the largest value in this column
        # below the current pivot row.
        max_row = pivot_row + np.argmax(
            np.abs(A[pivot_row:, col])
        )

        # If the column is effectively zero, there is no pivot.
        if abs(A[max_row, col]) < tolerance:
            continue

        # Swap rows
        A[[pivot_row, max_row]] = A[[max_row, pivot_row]]

        # Normalize pivot row
        A[pivot_row] = A[pivot_row] / A[pivot_row, col]

        # Eliminate this column from every other row
        for row in range(rows):

            if row != pivot_row:
                factor = A[row, col]

                if abs(factor) > tolerance:
                    A[row] = A[row] - factor * A[pivot_row]

        pivot_columns.append(col)

        pivot_row += 1

        # We cannot have more pivots than rows
        if pivot_row == rows:
            break

    # Clean very small floating-point errors
    A[np.abs(A) < tolerance] = 0

    return A, pivot_columns


def main():

    # 1. Create matrix X

    X, feature_columns = load_and_prepare_data()

    print("Original matrix shape:")
    print(X.shape)

    # 2. Perform RREF

    R, pivot_columns = rref(X)

    # 3. Display matrix structure

    print("\nRank of matrix:")
    print(len(pivot_columns))

    print("\nPivot columns:")

    for column in pivot_columns:
        print(
            f"{column + 1}. {feature_columns[column]}"
        )

    # 4. Find free columns

    free_columns = [
        i for i in range(len(feature_columns))
        if i not in pivot_columns
    ]

    print("\nFree columns:")

    if free_columns:
        for column in free_columns:
            print(
                f"{column + 1}. {feature_columns[column]}"
            )
    else:
        print("None")

    # 5. Display a small section of the RREF

    print("\nFirst 10 rows of RREF:")
    print(
        pd.DataFrame(
            R[:10, :],
            columns=feature_columns
        )
    )


if __name__ == "__main__":
    main()