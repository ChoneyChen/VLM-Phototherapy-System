from app.infrastructure.db.repositories import UserRepository


def test_user_id_prefix() -> None:
    assert UserRepository.build_public_id(1) == "USR-0001"
