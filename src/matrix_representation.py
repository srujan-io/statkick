import pandas as pd


DATA_PATH = "data/raw/players.csv"


def load_data():
    """Load the raw football dataset."""
    return pd.read_csv(DATA_PATH)


def prepare_data(df):
    """Clean basic fields and create per-90 progressive statistics."""

    #converting string literals to integers
    df["Minutes"] = (
        df["Minutes"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .astype(int)
    )

    # Avoid division by zero
    df = df[df["Minutes"] > 0].copy()

    # Convert progressive statistics to per-90 values
    df["Progressive Carries Per 90"] = (
        df["Progressive Carries"] / df["Minutes"]
    ) * 90

    df["Progressive Passes Per 90"] = (
        df["Progressive Passes"] / df["Minutes"]
    ) * 90

    df["Progressive Receives Per 90"] = (
        df["Progressive Receives"] / df["Minutes"]
    ) * 90

    return df


def create_matrix(df):
    """Create the player-feature matrix X."""

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

    X = df[feature_columns].copy()

    return X, feature_columns


def main():

    # Load raw data
    df = load_data()

    # Prepare data
    df = prepare_data(df)

    # Create matrix
    X, features = create_matrix(df)

    print("Number of players:", len(df))
    print("Number of features:", len(features))

    print("\nFeatures:")
    for i, feature in enumerate(features, start=1):
        print(f"{i}. {feature}")

    print("\nMatrix shape:")
    print(X.shape)

    print("\nFirst 5 rows of X:")
    print(X.head())


if __name__ == "__main__":
    main()